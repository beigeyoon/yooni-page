import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useMemo } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

interface Props {
  content: {
    title: string;
    desc: string[] | string[][];
  };
  links?: {
    title: string;
    src: string;
  }[];
  imgHref?: string;
}

export default function ItemCard({ content, links, imgHref }: Props) {
  const { title, desc } = content;
  const isTwoColumnDesc = useMemo(
    () =>
      desc.every(
        item =>
          Array.isArray(item) &&
          item.every(subItem => typeof subItem === 'string')
      ),
    [desc]
  );

  return (
    <Card className="flex w-full justify-between p-6 max-sm:p-2">
      <CardHeader className="max-w-[400px] p-4">
        <CardTitle className="text-xl text-neutral-400">{title}</CardTitle>
        <CardContent className="p-0 pt-2">
          {isTwoColumnDesc ? (
            <Table>
              <TableBody>
                {desc.map((item, idx) => (
                  <TableRow
                    key={idx}
                    className="border-0 max-sm:flex">
                    <TableCell
                      width={150}
                      className="py-1 pl-0 font-bold max-sm:px-0">
                      {item[0]}
                    </TableCell>
                    <TableCell className="py-1 max-sm:px-0">
                      {item[1]}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <>
              {desc.map((item, idx) => (
                <CardDescription
                  key={idx}
                  className="text-black">
                  - {item}
                </CardDescription>
              ))}
              {links &&
                links.map((item, idx) => (
                  <CardDescription
                    key={idx}
                    className="text-black">
                    <a
                      href={item.src}
                      target="_blank"
                      rel="noopener noreferrer">
                      - {item.title}{' '}
                      <ExternalLink className="inline-block h-4 w-4 align-text-top" />
                    </a>
                  </CardDescription>
                ))}
            </>
          )}
        </CardContent>
      </CardHeader>
      {imgHref && (
        <div className="relative h-[240px] w-[400px]">
          <Image
            src={imgHref}
            alt="project-image"
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}
    </Card>
  );
}
