import { startTransition, type FormEvent } from "react";

/**
 * Submits a form to a server action without React's automatic form reset, so people
 * keep what they typed when the server returns an error. Native validation still runs first.
 */
export function keepValuesSubmit(action: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
}
