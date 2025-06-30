'use client';

import { type ComponentProps } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '../ui/button';

type Props = ComponentProps<'button'> & {
  pendingText?: string;
};

export function SubmitButton({ children, pendingText, ...props }: Props) {
  const { pending, action } = useFormStatus();

  const isPending = pending && action === props.formAction;

  return (
    <Button
      {...props}
      type="submit"
      aria-disabled={pending}
      className="bg-blue-600"
    >
      {isPending ? pendingText : children}
    </Button>
  );
}
