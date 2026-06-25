"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Breadcrumbs() {
  const pathname = usePathname();

  // Parse pathname to generate breadcrumbs
  const pathSegments = pathname.split("/").filter(Boolean);
  
  // Format segments to look like AWS Breadcrumbs
  const items = [{ label: "Route 53", href: "/hosted-zones" }];

  pathSegments.forEach((segment, index) => {
    let label = segment.replace(/-/g, " ");
    label = label.charAt(0).toUpperCase() + label.slice(1);
    
    // Construct progressive href
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    
    items.push({ label, href });
  });

  return (
    <nav className="flex text-[13px] mb-4 overflow-x-auto whitespace-nowrap" aria-label="Breadcrumb">
      <ol className="flex items-center">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center">
              {item.href && !isLast ? (
                <Link href={item.href} className="text-aws-blue hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className="text-aws-text-secondary">
                  {item.label}
                </span>
              )}
              {!isLast && <span className="mx-2 text-aws-text-secondary text-xs">{">"}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
