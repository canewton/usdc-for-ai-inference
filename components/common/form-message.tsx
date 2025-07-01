export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  return (
    <div>
      {'success' in message && (
        <p className="text-green-600">{message.success}</p>
      )}
      {'error' in message && <p className="text-red-600">{message.error}</p>}
      {'message' in message && <p>{message.message}</p>}
    </div>
  );
}
