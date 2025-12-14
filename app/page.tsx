import AcmeLogo from '@/app/ui/acme-logo';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import styles from '@/app/ui/home.module.css';
import Image from 'next/image';
import { neon } from '@neondatabase/serverless';

export default function Page() {
  async function create(formData: FormData) {
    'use server';

    const sql = neon(process.env.DATABASE_URL!);
    const comment = formData.get('comment');

    await sql(
      'INSERT INTO comments (comment) VALUES ($1)',
      [comment]
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-6">
      <form action={create} className="mb-6">
        <input
          type="text"
          name="comment"
          placeholder="write a comment"
          className="border p-2 mr-2"
        />
        <button type="submit">Submit</button>
      </form>

      <div className={styles.shape} />
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-52">
        <AcmeLogo />
      </div>

      <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
        <div className="flex flex-col justify-center gap-6 rounded-lg bg-gray-50 px-6 py-10 md:w-2/5 md:px-20">
          <p className="text-xl text-gray-800 md:text-3xl md:leading-normal">
            <strong>Welcome to Acme.</strong> This is the example for the{' '}
            <a href="https://nextjs.org/learn/" className="text-blue-500">
              Next.js Learn Course
            </a>
          </p>

          <Link
            href="/login"
            className="flex items-center gap-5 self-start rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white hover:bg-blue-400"
          >
            <span>Log in</span>
            <ArrowRightIcon className="w-5" />
          </Link>
        </div>

        <div className="flex items-center justify-center p-6 md:w-3/5">
          <Image
            src="/hero-desktop.png"
            width={1000}
            height={760}
            className="hidden md:block"
            alt="Dashboard preview"
          />
        </div>
      </div>
    </main>
  );
}
