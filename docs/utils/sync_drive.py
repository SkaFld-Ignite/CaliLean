#!/usr/bin/env python3
"""Push repo files to Google Workspace Shared Drive via rclone."""

import json
import os
import subprocess
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent

RCLONE_REMOTE = 'Cali Lean'
DRIVE_ROOT = ''

SYNC_MAP = {
    'docs/brand/brand-book/': ('Cali Lean/Brand/', ['.pdf']),
    'docs/deliverables/pitch-deck/': ('Cali Lean/External/Deck/', ['.pdf']),
    'docs/ops/': ('Cali Lean/Ops/', ['.xlsx', '.csv']),
    'docs/build/docs/strategy/': ('Cali Lean/Strategy/', ['.docx']),
    'docs/brand/packaging/qr-codes/': ('Cali Lean/Brand/Packaging/QR Codes/', ['.png']),
    'docs/brand/packaging/renders/labels/': ('Cali Lean/Brand/Packaging/Labels/', ['.svg', '.png']),
    'docs/brand/packaging/renders/hero-image/': ('Cali Lean/Brand/Packaging/Hero Images/', ['.jpeg']),
    'docs/brand/packaging/export/color-reference.pdf': ('Cali Lean/Brand/Packaging/Color Reference/color-reference.pdf', ['.pdf']),
    'docs/build/docs/brand/packaging/ideation/': ('Cali Lean/Brand/Packaging/Ideation/', ['.docx']),
    'docs/build/docs/brand/assets/imagery/': ('Cali Lean/Brand/Imagery/', ['.docx']),
}

MANIFEST_PATH = PROJECT_ROOT / '.sync-state.json'


def load_manifest():
    if MANIFEST_PATH.exists():
        with open(MANIFEST_PATH) as f:
            return json.load(f)
    return {'version': 1, 'last_sync': None, 'files': {}}


def save_manifest(manifest):
    manifest['last_sync'] = datetime.now(timezone.utc).isoformat()
    with open(MANIFEST_PATH, 'w') as f:
        json.dump(manifest, f, indent=2)


def update_manifest_entry(manifest, local_path, drive_path, drive_url=None):
    local_file = PROJECT_ROOT / local_path if not isinstance(local_path, Path) else local_path
    rel_path = str(local_file.relative_to(PROJECT_ROOT))
    manifest['files'][rel_path] = {
        'local_mtime': datetime.fromtimestamp(
            local_file.stat().st_mtime, tz=timezone.utc
        ).isoformat(),
        'drive_mtime': datetime.now(timezone.utc).isoformat(),
        'drive_path': drive_path,
        'drive_url': drive_url or '',
        'last_synced': datetime.now(timezone.utc).isoformat(),
        'status': 'synced',
    }


def check_rclone():
    if not shutil.which('rclone'):
        print("ERROR: rclone is not installed.")
        print("  Install: brew install rclone")
        print("  Then run: rclone config")
        sys.exit(1)

    result = subprocess.run(['rclone', 'listremotes'], capture_output=True, text=True)
    if f'{RCLONE_REMOTE}:' not in result.stdout:
        print(f"ERROR: rclone remote '{RCLONE_REMOTE}' not configured.")
        print("  Run: rclone config")
        print(f"  Create a remote named '{RCLONE_REMOTE}' for Google Drive.")
        sys.exit(1)


def _parse_sync_entry(value):
    if isinstance(value, tuple):
        return value[0], value[1]
    return value, None


def resolve_drive_path(local_path):
    rel = str(local_path.relative_to(PROJECT_ROOT)).replace(os.sep, '/')
    best_match = None
    best_len = 0

    for repo_prefix, raw_value in SYNC_MAP.items():
        drive_prefix, _ = _parse_sync_entry(raw_value)
        if rel == repo_prefix.rstrip('/'):
            return drive_prefix, True
        if rel.startswith(repo_prefix):
            if len(repo_prefix) > best_len:
                best_match = (repo_prefix, drive_prefix)
                best_len = len(repo_prefix)

    if best_match is None:
        return None, None

    repo_prefix, drive_prefix = best_match
    remainder = rel[len(repo_prefix):]
    if remainder:
        return drive_prefix + remainder, True
    return drive_prefix, False


def resolve_paths(args):
    resolved = []
    for arg in args:
        if '*' in arg or '?' in arg:
            matches = sorted(PROJECT_ROOT.glob(arg))
            if not matches:
                print(f"WARNING: No files match pattern: {arg}")
            resolved.extend(matches)
        else:
            p = PROJECT_ROOT / arg
            if p.exists():
                resolved.append(p)
            else:
                print(f"WARNING: File not found: {arg}")
    return resolved


def push_file(local_path, dry_run=False):
    drive_path, is_file = resolve_drive_path(local_path)
    if drive_path is None:
        print(f"SKIP: {local_path.relative_to(PROJECT_ROOT)} — not in SYNC_MAP")
        return False, None

    remote_dest = f"{RCLONE_REMOTE}:{DRIVE_ROOT}{drive_path}"
    local_str = str(local_path)

    if dry_run:
        print(f"  [dry-run] {local_path.relative_to(PROJECT_ROOT)} → {drive_path}")
        return True, drive_path

    if is_file and local_path.is_file():
        cmd = ['rclone', 'copyto', local_str, remote_dest]
    else:
        print(f"SKIP: {local_path.relative_to(PROJECT_ROOT)} — expected file, got directory")
        return False, None

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ERROR: Failed to push {local_path.name}: {result.stderr.strip()}")
        return False, None

    print(f"  Pushed: {local_path.relative_to(PROJECT_ROOT)} → {drive_path}")
    return True, drive_path


def _get_ext_filter(local_dir):
    rel = str(local_dir.relative_to(PROJECT_ROOT)).replace(os.sep, '/') + '/'
    for repo_prefix, raw_value in SYNC_MAP.items():
        if rel == repo_prefix or rel.startswith(repo_prefix):
            _, ext_filter = _parse_sync_entry(raw_value)
            return ext_filter
    return None


def push_directory(local_dir, dry_run=False):
    drive_path, _ = resolve_drive_path(local_dir)
    if drive_path is None:
        print(f"SKIP: {local_dir.relative_to(PROJECT_ROOT)} — not in SYNC_MAP")
        return 0, []

    ext_filter = _get_ext_filter(local_dir)
    remote_dest = f"{RCLONE_REMOTE}:{DRIVE_ROOT}{drive_path}"
    local_str = str(local_dir)

    files = [f for f in local_dir.rglob('*')
             if f.is_file() and f.name != '.DS_Store' and not f.name.startswith('~$')
             and 'archive' not in f.relative_to(local_dir).parts]
    if ext_filter:
        files = [f for f in files if f.suffix.lower() in ext_filter]

    if dry_run:
        for f in files:
            rel = f.relative_to(PROJECT_ROOT)
            print(f"  [dry-run] {rel} → {drive_path}{f.relative_to(local_dir)}")
        return len(files), []

    cmd = ['rclone', 'copy', local_str, remote_dest, '--exclude', '.DS_Store']
    if ext_filter:
        for ext in ext_filter:
            cmd.extend(['--include', f'*{ext}'])
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ERROR: Failed to push {local_dir.name}: {result.stderr.strip()}")
        return 0, []

    print(f"  Pushed: {local_dir.relative_to(PROJECT_ROOT)}/ → {drive_path} ({len(files)} files)")

    pushed_files = []
    for f in files:
        rel_within_dir = str(f.relative_to(local_dir)).replace(os.sep, '/')
        file_drive_path = drive_path + rel_within_dir
        pushed_files.append((f, file_drive_path))

    return len(files), pushed_files


def get_remote_mtime(drive_path):
    parent = str(Path(drive_path).parent)
    filename = Path(drive_path).name
    remote = f"{RCLONE_REMOTE}:{DRIVE_ROOT}{parent}"

    result = subprocess.run(['rclone', 'lsjson', remote], capture_output=True, text=True)
    if result.returncode != 0 or not result.stdout.strip():
        return None

    try:
        entries = json.loads(result.stdout)
    except json.JSONDecodeError:
        return None

    for entry in entries:
        if entry.get('Name') == filename:
            mod_time = entry.get('ModTime', '')
            try:
                if '.' in mod_time:
                    base, _ = mod_time.split('.', 1)
                    mod_time = base + '+00:00'
                return datetime.fromisoformat(mod_time)
            except ValueError:
                return None

    return None


def check_conflicts_fn(local_path):
    drive_path, is_file = resolve_drive_path(local_path)
    if drive_path is None or not is_file:
        return 'safe'

    remote_mtime = get_remote_mtime(drive_path)
    if remote_mtime is None:
        return 'safe'

    local_mtime = datetime.fromtimestamp(local_path.stat().st_mtime, tz=timezone.utc)

    if remote_mtime > local_mtime:
        local_str = local_mtime.strftime("%Y-%m-%d %H:%M")
        remote_str = remote_mtime.strftime("%Y-%m-%d %H:%M")
        print(f"CONFLICT: {local_path.name}")
        print(f"  Local:  {local_str} (older)")
        print(f"  Drive:  {remote_str} (newer)")
        print(f"  Skipping. Use --force to overwrite.")
        return 'conflict'

    return 'safe'


def push_all(dry_run=False, check_conflicts=False, force=False, sync_map=None, manifest=None):
    if sync_map is None:
        sync_map = SYNC_MAP
    count = 0
    skipped = 0
    for repo_path in sync_map:
        full_path = PROJECT_ROOT / repo_path
        if not full_path.exists():
            print(f"WARNING: Mapped path does not exist: {repo_path}")
            continue

        if full_path.is_file():
            if check_conflicts and not force:
                if check_conflicts_fn(full_path) == 'conflict':
                    skipped += 1
                    continue
            ok, drive_path = push_file(full_path, dry_run=dry_run)
            if ok:
                count += 1
                if manifest is not None and drive_path and not dry_run:
                    update_manifest_entry(manifest, full_path, drive_path)
        elif full_path.is_dir():
            n, pushed_files = push_directory(full_path, dry_run=dry_run)
            count += n
            if manifest is not None and not dry_run:
                for local_file, drive_path in pushed_files:
                    update_manifest_entry(manifest, local_file, drive_path)

    if skipped:
        print(f"Skipped {skipped} conflicting file(s). Use --force to overwrite.")
    return count


def show_status():
    manifest = load_manifest()
    if not manifest['files']:
        print("No sync history found. Run 'push --all' first.")
        return

    changed = []
    synced = []

    for rel_path, entry in manifest['files'].items():
        local_file = PROJECT_ROOT / rel_path
        if not local_file.exists():
            continue
        current_mtime = datetime.fromtimestamp(
            local_file.stat().st_mtime, tz=timezone.utc
        ).isoformat()
        if current_mtime > entry['local_mtime']:
            changed.append((rel_path, entry))
        else:
            synced.append((rel_path, entry))

    if changed:
        print(f"CHANGED ({len(changed)} files):")
        for path, entry in changed:
            print(f"  {path}")

    if synced:
        print(f"\nSYNCED ({len(synced)} files):")
        for path, entry in synced:
            last = entry.get('last_synced', 'unknown')
            print(f"  {path}  (synced: {last[:10]})")

    not_tracked = []
    for repo_path in SYNC_MAP:
        full = PROJECT_ROOT / repo_path
        if full.is_dir():
            _, ext_filter = _parse_sync_entry(SYNC_MAP[repo_path])
            for f in full.rglob('*'):
                if f.is_file():
                    if ext_filter and f.suffix.lower() not in ext_filter:
                        continue
                    rel = str(f.relative_to(PROJECT_ROOT))
                    if rel not in manifest['files']:
                        not_tracked.append(rel)
        elif full.is_file():
            rel = str(full.relative_to(PROJECT_ROOT))
            if rel not in manifest['files']:
                not_tracked.append(rel)

    if not_tracked:
        print(f"\nNOT YET SYNCED ({len(not_tracked)} files):")
        for path in not_tracked:
            print(f"  {path}")

    print(f"\nLast sync: {manifest.get('last_sync', 'never')}")


def check_all_conflicts():
    manifest = load_manifest()
    if not manifest['files']:
        print("No sync history. Run 'push --all' first.")
        return

    conflicts = []
    safe = []

    for rel_path, entry in manifest['files'].items():
        local_file = PROJECT_ROOT / rel_path
        if not local_file.exists():
            continue
        current_mtime = datetime.fromtimestamp(
            local_file.stat().st_mtime, tz=timezone.utc
        ).isoformat()
        if current_mtime <= entry['local_mtime']:
            continue

        drive_path = entry.get('drive_path', '')
        if not drive_path:
            safe.append(rel_path)
            continue

        remote_mtime = get_remote_mtime(drive_path)
        if remote_mtime is None:
            safe.append(rel_path)
            continue

        manifest_drive_mtime = entry.get('drive_mtime', '')
        if manifest_drive_mtime:
            try:
                manifest_dt = datetime.fromisoformat(manifest_drive_mtime)
                if remote_mtime > manifest_dt:
                    conflicts.append((rel_path, 'both changed'))
                    continue
            except ValueError:
                pass

        safe.append(rel_path)

    if conflicts:
        print(f"CONFLICTS ({len(conflicts)}):")
        for path, reason in conflicts:
            print(f"  {path} — {reason}")

    if safe:
        print(f"\nSAFE TO PUSH ({len(safe)}):")
        for path in safe:
            print(f"  {path}")

    if not conflicts and not safe:
        print("No locally-changed files found.")


def main():
    args = sys.argv[1:]

    if not args:
        print("Usage: python3 src/drive/sync_drive.py <command> [options] [paths...]")
        print("")
        print("Commands:")
        print("  push                 Push files to Google Drive")
        print("  status               Show sync status of mapped files")
        print("  check-conflicts      Check locally-changed files for Drive-side conflicts")
        print("")
        print("Push options:")
        print("  --all                Push all mapped files")
        print("  --dry-run            Show what would be uploaded")
        print("  --check-conflicts    Check for Drive-side changes before pushing")
        print("  --force              Push even if Drive version is newer")
        print("  --target=<substr>    Only push SYNC_MAP entries containing <substr>")
        print("")
        print("Examples:")
        print("  push --all")
        print("  push --dry-run --all")
        print("  push --all --check-conflicts")
        print("  push --all --check-conflicts --force")
        print("  push --all --target=external")
        print("  push output/internal/brand/")
        print("  status")
        print("  check-conflicts")
        sys.exit(1)

    cmd = args[0]
    args = args[1:]

    if cmd == 'status':
        show_status()
        return

    if cmd == 'check-conflicts':
        check_all_conflicts()
        return

    if cmd != 'push':
        print(f"Unknown command: {cmd}")
        sys.exit(1)

    dry_run = '--dry-run' in args
    do_all = '--all' in args
    do_check = '--check-conflicts' in args
    force = '--force' in args

    target = None
    for i, a in enumerate(args):
        if a.startswith('--target='):
            target = a.split('=', 1)[1]
        elif a == '--target':
            if i + 1 < len(args):
                target = args[i + 1]

    paths = [a for a in args if not a.startswith('--')]

    check_rclone()
    manifest = load_manifest()

    if dry_run:
        print("DRY RUN — no files will be uploaded.\n")

    if do_all:
        sync_map = SYNC_MAP
        if target:
            sync_map = {k: v for k, v in SYNC_MAP.items() if target in k}
            if not sync_map:
                print(f"No SYNC_MAP entries match --target '{target}'")
                sys.exit(1)

        count = push_all(dry_run=dry_run, check_conflicts=do_check, force=force,
                         sync_map=sync_map, manifest=manifest)
        print(f"\n{'Would push' if dry_run else 'Pushed'} {count} file(s).")
        if not dry_run and count > 0:
            save_manifest(manifest)
        return

    if not paths:
        print("ERROR: No paths specified. Use --all or provide file/folder paths.")
        sys.exit(1)

    resolved = resolve_paths(paths)
    if not resolved:
        print("No valid files to push.")
        sys.exit(1)

    conflicts = []
    if do_check and not force:
        for p in resolved:
            if p.is_file() and check_conflicts_fn(p) == 'conflict':
                conflicts.append(p)

    count = 0
    for p in resolved:
        if p in conflicts:
            continue
        if p.is_dir():
            n, pushed_files = push_directory(p, dry_run=dry_run)
            count += n
            if not dry_run:
                for local_file, drive_path in pushed_files:
                    update_manifest_entry(manifest, local_file, drive_path)
        elif p.is_file():
            ok, drive_path = push_file(p, dry_run=dry_run)
            if ok:
                count += 1
                if not dry_run and drive_path:
                    update_manifest_entry(manifest, p, drive_path)

    print(f"\n{'Would push' if dry_run else 'Pushed'} {count} file(s).")
    if conflicts:
        print(f"Skipped {len(conflicts)} conflicting file(s). Use --force to overwrite.")

    if not dry_run and count > 0:
        save_manifest(manifest)


if __name__ == '__main__':
    main()
