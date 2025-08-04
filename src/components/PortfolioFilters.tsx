'use client'

import { AssetType } from '@prisma/client'

interface PortfolioFiltersProps {
  selectedTypes: AssetType[]
  selectedPeriod: string
  onTypeChange: (types: AssetType[]) => void
  onPeriodChange: (period: string) => void
}

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  TESOURO_DIRETO: 'Tesouro Direto',
  POUPANCA: 'Poupança',
  CDB: 'CDB',
  FII: 'FII',
  REIT: 'REIT',
  ACAO_BR: 'Ação BR',
  ACAO_US: 'Ação US',
  DEBENTURE: 'Debênture',
  RENDA_FIXA_DIGITAL: 'Renda Fixa Digital',
  STAKING_CRYPTO: 'Staking Crypto',
  CRI: 'CRI',
  FI_INFRA: 'FI-Infra',
  OUTROS: 'Outros'
}

// Agrupamento dos tipos de ativos
const ASSET_TYPE_GROUPS = {
  'Renda Fixa': [
    'TESOURO_DIRETO',
    'POUPANCA',
    'CDB',
    'DEBENTURE',
    'RENDA_FIXA_DIGITAL',
    'CRI'
  ],
  'Fundos': [
    'FII',
    'REIT',
    'FI_INFRA'
  ],
  'Ações': [
    'ACAO_BR',
    'ACAO_US'
  ],
  'Outros': [
    'STAKING_CRYPTO',
    'OUTROS'
  ]
} as const

const PERIODS = [
  { value: '1m', label: '1 Mês' },
  { value: '3m', label: '3 Meses' },
  { value: '6m', label: '6 Meses' },
  { value: '1y', label: '1 Ano' },
  { value: 'ytd', label: 'Ano Atual' },
  { value: 'all', label: 'Todo Período' }
]

export function PortfolioFilters({
  selectedTypes,
  selectedPeriod,
  onTypeChange,
  onPeriodChange
}: PortfolioFiltersProps) {
  const handleTypeToggle = (type: AssetType) => {
    if (selectedTypes.includes(type)) {
      onTypeChange(selectedTypes.filter(t => t !== type))
    } else {
      onTypeChange([...selectedTypes, type])
    }
  }

  const handleSelectAllTypes = () => {
    onTypeChange(Object.keys(ASSET_TYPE_LABELS) as AssetType[])
  }

  const handleClearTypes = () => {
    onTypeChange([])
  }

  const handleSelectGroup = (groupTypes: string[]) => {
    const currentSelected = new Set(selectedTypes)
    const groupSet = new Set(groupTypes)
    
    // Se todos os tipos do grupo já estão selecionados, remove todos
    const allSelected = groupTypes.every(type => currentSelected.has(type as AssetType))
    
    if (allSelected) {
      onTypeChange(selectedTypes.filter(type => !groupSet.has(type)))
    } else {
      // Adiciona todos os tipos do grupo que não estão selecionados
      const newTypes = new Set([...selectedTypes])
      groupTypes.forEach(type => newTypes.add(type as AssetType))
      onTypeChange(Array.from(newTypes))
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Tipos de Ativo</h3>
          <div className="space-x-2">
            <button
              onClick={handleSelectAllTypes}
              className="text-sm text-blue-500 hover:underline"
            >
              Selecionar Todos
            </button>
            <button
              onClick={handleClearTypes}
              className="text-sm text-gray-500 hover:underline"
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(ASSET_TYPE_GROUPS).map(([groupName, groupTypes]) => (
            <div key={groupName} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">{groupName}</h4>
                <button
                  onClick={() => handleSelectGroup(groupTypes)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  {groupTypes.every(type => selectedTypes.includes(type as AssetType))
                    ? 'Desmarcar Grupo'
                    : 'Selecionar Grupo'
                  }
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {groupTypes.map(type => (
                  <label
                    key={type}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type as AssetType)}
                      onChange={() => handleTypeToggle(type as AssetType)}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">{ASSET_TYPE_LABELS[type as AssetType]}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2">Período</h3>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map(period => (
            <button
              key={period.value}
              onClick={() => onPeriodChange(period.value)}
              className={`px-3 py-1 rounded text-sm ${
                selectedPeriod === period.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}