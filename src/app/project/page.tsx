import { PROJECTS_CONTENT } from '@/constants/projects';
import ProjectCard from '@/components/ProjectCard';

export default function Projects() {
  return (
    <div className="mx-auto mt-8 grid max-w-[900px] grid-cols-2 gap-8 max-sm:flex max-sm:flex-col max-sm:p-6">
      {PROJECTS_CONTENT.map((item, idx) => (
        <ProjectCard
          key={idx}
          content={item}
          links={item.links}
          imgHref={item.imgHref}
        />
      ))}
    </div>
  );
}
