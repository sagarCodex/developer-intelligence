import { redirect } from 'next/navigation';

export default function SignUpPage() {
  // Redirect to sign-in — Google OAuth handles both sign-up and sign-in
  redirect('/sign-in');
}
