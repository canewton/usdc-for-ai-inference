export type Message = { type: 'error' | 'success'; message: string };

export function FormMessage({ message }: { message: Message | null }) {
  console.log('FormMessage', message);
  return (
    <div>
      {message?.type == 'success' && (
        <p className="text-green-600">{message.message}</p>
      )}
      {message?.type == 'error' && (
        <p className="text-red-600">{message.message}</p>
      )}
    </div>
  );
}
