import { PlusIcon } from '@heroicons/react/20/solid'

export function AddAssetButton() {
  return (
    <button
      type="button"
      className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
    >
      <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
      Adicionar Ativo
    </button>
  )
}