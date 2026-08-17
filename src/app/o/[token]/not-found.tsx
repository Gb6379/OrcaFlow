export default function QuoteNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 text-center">
      <div>
        <p className="font-serif text-4xl">Orçamento não encontrado</p>
        <p className="mt-2 text-mute">Este link pode ter expirado ou sido apagado.</p>
      </div>
    </div>
  );
}
