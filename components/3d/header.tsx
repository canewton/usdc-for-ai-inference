import { Button } from "@/components/ui/button";

interface HeaderProps {
  mode: boolean;
  setMode: (mode: boolean) => void;
}

export default function Header({ mode, setMode }: HeaderProps) {
  return (
    <div className="p-4 flex justify-start">
      <Button
        onClick={() => setMode(false)}
        className={`mr-2 ${
          !mode ? "bg-blue-500 text-white" : "bg-gray-200"
        } rounded-full px-4 py-2`}
      >
        Preview
      </Button>
      <Button
        onClick={() => setMode(true)}
        className={`mr-2 ${
          mode ? "bg-blue-500 text-white" : "bg-gray-200"
        } rounded-full px-4 py-2`}
      >
        Refine
      </Button>
    </div>
  );
}
