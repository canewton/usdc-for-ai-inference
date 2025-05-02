import Blurs from '@/public/blurs.svg';

interface AiGenerationIntroProps {
  title: string;
  description: string;
}

export const AiGenerationIntro = ({
  title,
  description,
}: AiGenerationIntroProps) => {
  return (
    <div className="relative w-full h-full">
      <img
        src={Blurs.src}
        alt="blur background"
        className="w-1/2 object-contain mx-auto"
      />
      <div className="inset-0 flex items-center justify-center absolute">
        <div className="flex flex-col items-center justify-center w-1/3 text-center">
          <h1 className="text-5xl text-body mb-2">{title}</h1>
          <p className="text-xl text-sub">{description}</p>
        </div>
      </div>
    </div>
  );
};
