import { PROJECTS_CONTENT } from '@/constants/projects';
import ProjectCard from '@/components/ProjectCard';

export default function Projects() {
  return (
    <div className="grid grid-cols-2 gap-8 px-20 py-12">
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
