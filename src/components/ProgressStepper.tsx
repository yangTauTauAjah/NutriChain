import React from 'react';

interface Props {
  step: number;
}

export function ProgressStepper({ step }: Props) {
  const steps = ['Profile', 'Health Info', 'Lifestyle', 'Results'];
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                  done   ? 'bg-green-100 text-green-700' :
                  active ? 'bg-green-600 text-white'     :
                           'bg-gray-100 text-gray-400'
                }`}
              >
                {done ? '✓' : n}
              </div>
              <span className={`text-xs font-medium ${active || done ? 'text-green-700' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-16 mx-2 mb-5 ${n < step ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
