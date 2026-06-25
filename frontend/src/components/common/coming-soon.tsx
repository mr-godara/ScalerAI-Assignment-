export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-aws-text mb-4">{title}</h1>
      <div className="bg-aws-white border border-aws-border p-8 rounded flex items-center justify-center">
        <p className="text-aws-text-secondary text-lg">Coming Soon</p>
      </div>
    </div>
  );
}
