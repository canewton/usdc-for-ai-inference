import Link from 'next/link';

import { TutorialStep } from './tutorial-step';

export default function SignUpUserSteps() {
  return (
    <ol className="flex flex-col gap-6">
      {process.env.VERCEL_ENV === 'preview' ||
      process.env.VERCEL_ENV === 'production' ? (
        <div></div>
      ) : null} 
    </ol>
  );
}
