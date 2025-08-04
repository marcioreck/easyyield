'use client'

import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid'

interface CardProps {
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
}

export function Card({ title, value, change, changeType }: CardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {changeType === 'increase' ? (
              <ArrowUpIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
            ) : (
              <ArrowDownIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
            )}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <span
            className={`font-medium ${
              changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change}
          </span>{' '}
          <span className="text-gray-500">vs. mês anterior</span>
        </div>
      </div>
    </div>
  )
}