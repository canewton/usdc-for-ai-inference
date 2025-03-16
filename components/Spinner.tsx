export function Spinner() {
  return (
    <div className="flex justify-center items-center h-full">
      <div className="inline-block h-6 w-6 animate-spin rounded-full border-[3px] border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status"></div>
    </div>
  );
}
