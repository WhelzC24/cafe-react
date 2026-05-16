interface QuickChatChipsProps {
  chips: string[]
  onChipClick: (label: string) => void
}

export default function QuickChatChips({ chips, onChipClick }: QuickChatChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
      {chips.map(chip => (
        <button
          key={chip}
          onClick={() => onChipClick(chip)}
          className="px-3 py-1.5 text-xs font-medium rounded-full border border-espresso-200 text-espresso-700 bg-white hover:bg-espresso-100 hover:border-espresso-300 transition-colors whitespace-nowrap dark:bg-espresso-700 dark:border-espresso-600 dark:text-cream dark:hover:bg-espresso-600"
        >
          {chip}
        </button>
      ))}
    </div>
  )
}
