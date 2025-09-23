import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Welcome</h1>
        <p className="mb-6">ECG Bill Calculator demo app.</p>
        <Link
          href="/ecg-bill-calculator"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Open Calculator
        </Link>
      </div>
    </div>
  );
}
