import { Fragment } from 'react';
import { KeyRound, Star } from 'lucide-react';
import { Employee, RecognitionTagId, TALENT_RECOGNITIONS } from '../types';
import TruncatedTooltip from './TruncatedTooltip';

interface EmployeeRecognitionIconsProps {
  employee?: Pick<Employee, 'recognitions'> | null;
  recognitions?: string[];
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const renderRecognitionIcon = (
  id: RecognitionTagId,
  sizeClass: string,
  active = true
) => {
  switch (id) {
    case 'high_potential':
      return (
        <Star
          className={`${sizeClass} shrink-0 ${
            active ? 'text-amber-600/80 fill-amber-300/65' : 'text-slate-400'
          }`}
        />
      );
    case 'key_person':
      return (
        <KeyRound
          className={`${sizeClass} shrink-0 ${
            active ? 'text-indigo-600/80 fill-indigo-200/50' : 'text-slate-400'
          }`}
        />
      );
    default:
      return <Star className={`${sizeClass} text-amber-600/80 shrink-0`} />;
  }
};

export default function EmployeeRecognitionIcons({
  employee,
  recognitions,
  size = 'sm',
  className = ''
}: EmployeeRecognitionIconsProps) {
  const rawList = employee?.recognitions ?? recognitions ?? [];
  if (!Array.isArray(rawList) || rawList.length === 0) return null;

  const activeDefs = TALENT_RECOGNITIONS.filter(def => rawList.includes(def.id));
  if (activeDefs.length === 0) return null;

  const sizeClass =
    size === 'xs' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  return (
    <span className={`inline-flex items-center gap-1 shrink-0 ${className}`}>
      {activeDefs.map(def => (
        <Fragment key={def.id}>
          <TruncatedTooltip
            text={def.tooltip}
            onlyWhenTruncated={false}
            className="inline-flex items-center justify-center shrink-0"
          >
            <span
              tabIndex={0}
              aria-label={def.label}
              className="inline-flex items-center justify-center rounded-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
            >
              {renderRecognitionIcon(def.id, sizeClass)}
            </span>
          </TruncatedTooltip>
        </Fragment>
      ))}
    </span>
  );
}
