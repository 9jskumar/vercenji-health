import { startTransition, type FormEvent } from "react";

/**
 * Submits a form to a server action without React's automatic form reset, so people
 * keep what they typed when the server returns an error. Native validation still runs first.
 */
export function keepValuesSubmit(action: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Include the clicked button's name/value (e.g. "Save as draft" vs "Publish").
    const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => action(fd));
  };
}
