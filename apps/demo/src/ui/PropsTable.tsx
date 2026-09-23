import type { PropDoc } from '../types';

interface PropsTableProps {
  props: readonly PropDoc[];
  caption: string;
}

export function PropsTable({ props, caption }: PropsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-widest text-text-2">
            <th scope="col" className="py-2 pr-4 font-normal">
              Prop
            </th>
            <th scope="col" className="py-2 pr-4 font-normal">
              Type
            </th>
            <th scope="col" className="py-2 font-normal">
              Rôle
            </th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className="border-b border-line-soft align-top">
              <th scope="row" className="py-3 pr-4 font-mono text-[13px] font-normal text-text-1">
                {prop.name}
                {prop.required && (
                  <span className="ml-1.5 text-accent" title="obligatoire" aria-label="obligatoire">
                    *
                  </span>
                )}
              </th>
              <td className="py-3 pr-4 font-mono text-[12px] text-text-2">{prop.type}</td>
              <td className="py-3 text-text-2">{prop.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
