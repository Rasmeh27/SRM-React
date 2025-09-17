import { Link } from "react-router-dom";
import ImageWithFallback from "./ImageWithFallback";

export default function ActionCard({
  image,
  title,
  subtitle,
  cta,
  to,
}: {
  image: string;
  title: string;
  subtitle: string;
  cta: string;
  to: string;
}) {
  return (
    <div className="rounded-3xl border bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <ImageWithFallback
        src={image}
        alt={title}
        className="h-36 w-full rounded-2xl object-cover"
      />
      <div className="mt-3">
        <h3 className="text-lg font-bold text-teal-700">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        <Link
          to={to}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}
