"use client"

import React, { createContext, useContext, useState } from "react"

type RefData = {
  id: number
  authors: string
  title: string
  journal: string
  year: number
  pmid: string
  url?: string
}

const ReferencesContext = createContext<{
  refs: Map<number, RefData>
  register: (ref: RefData) => void
}>({
  refs: new Map(),
  register: () => {},
})

type CiteProps = {
  id: number
}

export const Cite: React.FC<CiteProps> = ({ id }) => {
  const { refs } = useContext(ReferencesContext)
  const ref = refs.get(id)
  const title = ref?.title || `Reference ${id}`

  return (
    <a
      href={`#ref-${id}`}
      title={title}
      className="inline-flex items-center px-1.5 py-0.5 bg-calilean-pacific/10 rounded text-[11px] font-medium text-calilean-pacific no-underline hover:bg-calilean-pacific/20 transition-colors"
    >
      {id}
    </a>
  )
}

type RefProps = {
  id: number
  authors: string
  title: string
  journal: string
  year: number
  pmid: string
  url?: string
}

export const Ref: React.FC<RefProps> = (props) => {
  const { register } = useContext(ReferencesContext)

  React.useEffect(() => {
    register(props)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const href = props.url || `https://pubmed.ncbi.nlm.nih.gov/${props.pmid}/`

  return (
    <li id={`ref-${props.id}`} className="py-1.5 text-[11px] leading-relaxed text-calilean-fog">
      <span className="text-calilean-pacific font-medium mr-1">[{props.id}]</span>
      {props.authors} &ldquo;{props.title}&rdquo;{" "}
      <em>{props.journal}.</em> {props.year}.{" "}
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="text-calilean-pacific underline-offset-2 hover:underline"
      >
        PubMed
      </a>
    </li>
  )
}

type ReferencesProps = {
  children: React.ReactNode
}

export const References: React.FC<ReferencesProps> = ({ children }) => {
  const [expanded, setExpanded] = useState(false)
  const [refs] = useState<Map<number, RefData>>(new Map())

  const register = (ref: RefData) => {
    refs.set(ref.id, ref)
  }

  return (
    <ReferencesContext.Provider value={{ refs, register }}>
      <section id="references" className="scroll-mt-24">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-lg font-bold text-calilean-ink mb-4 pb-2 border-b border-calilean-sand"
        >
          <span>References</span>
          <span className="text-calilean-fog text-sm font-normal">
            {expanded ? "Collapse" : "Expand"}
          </span>
        </button>
        {expanded && (
          <ol className="list-none space-y-0 divide-y divide-calilean-sand/50">
            {children}
          </ol>
        )}
      </section>
    </ReferencesContext.Provider>
  )
}
