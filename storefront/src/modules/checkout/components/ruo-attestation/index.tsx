"use client"

import { Checkbox, Label } from "@medusajs/ui"
import { useState, useTransition } from "react"
import { setRuoAttestation } from "@lib/data/cart"
import { RUO_ATTESTATION_LABEL } from "@lib/ruo"

type Props = {
  agreed: boolean
  onChange?: (agreed: boolean) => void
}

const RuoAttestation = ({ agreed: initialAgreed, onChange }: Props) => {
  const [agreed, setAgreed] = useState(initialAgreed)
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    const next = !agreed
    setAgreed(next)
    onChange?.(next)
    startTransition(async () => {
      await setRuoAttestation(next)
    })
  }

  return (
    <div className="flex items-start gap-x-2 mb-4">
      <Checkbox
        id="ruo-attestation"
        checked={agreed}
        aria-checked={agreed}
        onClick={toggle}
        disabled={isPending}
        data-testid="ruo-attestation-checkbox"
        className="mt-0.5"
      />
      <Label
        htmlFor="ruo-attestation"
        className="!transform-none !txt-medium cursor-pointer"
        size="large"
      >
        {RUO_ATTESTATION_LABEL}
      </Label>
    </div>
  )
}

export default RuoAttestation
