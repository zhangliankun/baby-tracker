export default function LoadingSpinner({ text = '加载中...', size = 'md' }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={`${sizeMap[size] || sizeMap.md} border-4 border-brand-secondary-light border-t-brand-primary rounded-full animate-spin`}
      />
      {text && <p className="text-sm text-text-secondary">{text}</p>}
    </div>
  );
}
