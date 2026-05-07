import React from "react"

type ComparisonTableProps = {
  compounds: string[]
  rows: Array<{
    label: string
    values: string[]
  }>
  highlightIndex?: number
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({
  compounds,
  rows,
  highlightIndex = 0,
}) => {
  if (!compounds || !rows || compounds.length === 0) return null

  return (
    <section id="compound-comparison" className="scroll-mt-24">
      <h2 className="text-lg font-bold text-calilean-ink mb-4 pb-2 border-b border-calilean-sand">
        Compound Comparison
      </h2>
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-calilean-sand">
              <th className="text-left py-3 pr-4 text-calilean-fog font-medium w-[120px] sticky left-0 bg-calilean-bg z-10" />
              {compounds.map((compound, i) => (
                <th
                  key={compound}
                  className={`text-center py-3 px-3 font-semibold ${
                    i === highlightIndex
                      ? "text-calilean-pacific"
                      : "text-calilean-fog"
                  }`}
                >
                  {compound}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-calilean-sand">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="py-3 pr-4 text-calilean-fog font-medium sticky left-0 bg-calilean-bg z-10">
                  {row.label}
                </td>
                {row.values.map((value, i) => (
                  <td
                    key={i}
                    className={`py-3 px-3 text-center ${
                      i === highlightIndex
                        ? "text-calilean-ink"
                        : "text-calilean-fog"
                    }`}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default ComparisonTable
