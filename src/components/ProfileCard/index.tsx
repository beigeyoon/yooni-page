import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useMemo } from 'react';

interface Props {
  content: {
    title: string;
    desc: string[] | string[][];
  };
}

export default function ProfileCard({ content }: Props) {
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
    <Card className="hover:bg-neutral-100">
      <CardHeader>
        <CardTitle className="text-xl text-neutral-400">{title}</CardTitle>
        <CardContent className="p-0 pt-2">
          {isTwoColumnDesc ? (
            <Table>
              <TableBody>
                {desc.map((item, idx) => (
                  <TableRow
                    key={idx}
                    className="border-0">
                    <TableCell
                      width={150}
                      className="py-1 pl-0 font-bold">
                      {item[0]}
                    </TableCell>
                    <TableCell className="py-1">{item[1]}</TableCell>
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
            </>
          )}
        </CardContent>
      </CardHeader>
    </Card>
  );
}
