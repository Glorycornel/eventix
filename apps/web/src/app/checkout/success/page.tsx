import { Suspense } from 'react';
import { CheckoutSuccessClient } from './CheckoutSuccessClient';

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}
