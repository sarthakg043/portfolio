-- Portfolio seed
--
-- This block intentionally resolves the sole administrator through the private
-- allowlist populated by private.configure_admin_email(). No administrator
-- address is committed here. A fresh local reset without an authenticated
-- administrator skips the content portion and still creates the buckets above.
do $$
declare
  administrator_id uuid;
  avatar_id uuid;
  frontend_resume_id uuid;
  java_resume_id uuid;
  cyber_resume_id uuid;
  bharatdns_image_id uuid;
  bharatdns_frontend_image_id uuid;
  status_agent_image_id uuid;
  face_attendance_image_id uuid;
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values
    ('draft-media', 'draft-media', false, 52428800,
      array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf', 'application/zip']),
    ('blog-media', 'blog-media', true, 10485760,
      array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
    ('blog-downloads', 'blog-downloads', true, 52428800,
      array['application/pdf', 'application/zip', 'text/plain', 'application/json']),
    ('portfolio-assets', 'portfolio-assets', true, 52428800,
      array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'])
  on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

  select user_id
  into administrator_id
  from private.admin_users
  order by created_at
  limit 1;

  if administrator_id is null then
    raise notice 'Portfolio content seed skipped: no configured administrator user exists yet.';
    return;
  end if;

  select id into avatar_id
  from public.assets
  where owner_id = administrator_id
    and storage_bucket = 'portfolio-assets'
    and original_name = 'avatar.jpg'
  order by created_at desc
  limit 1;

  select id into frontend_resume_id
  from public.assets
  where owner_id = administrator_id
    and storage_bucket = 'portfolio-assets'
    and original_name = 'resume_frontend.pdf'
  order by created_at desc
  limit 1;

  select id into java_resume_id
  from public.assets
  where owner_id = administrator_id
    and storage_bucket = 'portfolio-assets'
    and original_name = 'resume_java.pdf'
  order by created_at desc
  limit 1;

  select id into cyber_resume_id
  from public.assets
  where owner_id = administrator_id
    and storage_bucket = 'portfolio-assets'
    and original_name = 'resume_cyber.pdf'
  order by created_at desc
  limit 1;

  select id into bharatdns_image_id
  from public.assets
  where owner_id = administrator_id
    and storage_bucket = 'portfolio-assets'
    and original_name = 'bharatdns.png'
  order by created_at desc
  limit 1;

  select id into bharatdns_frontend_image_id
  from public.assets
  where owner_id = administrator_id
    and storage_bucket = 'portfolio-assets'
    and original_name = 'bharatdns-frontend.png'
  order by created_at desc
  limit 1;

  select id into status_agent_image_id
  from public.assets
  where owner_id = administrator_id
    and storage_bucket = 'portfolio-assets'
    and original_name = 'status-update-agent.png'
  order by created_at desc
  limit 1;

  select id into face_attendance_image_id
  from public.assets
  where owner_id = administrator_id
    and storage_bucket = 'portfolio-assets'
    and original_name = 'face-attendance.png'
  order by created_at desc
  limit 1;

  if avatar_id is null
     or frontend_resume_id is null
     or java_resume_id is null
     or cyber_resume_id is null
     or bharatdns_image_id is null
     or bharatdns_frontend_image_id is null
     or status_agent_image_id is null
     or face_attendance_image_id is null then
    raise exception 'Portfolio content seed requires all eight portfolio assets to be uploaded first.';
  end if;

  update public.assets
  set kind = 'avatar',
      display_name = 'Sarthak Gupta portrait',
      alt_text = 'Portrait of Sarthak Gupta'
  where id = avatar_id;

  update public.assets
  set kind = 'resume',
      display_name = case id
        when frontend_resume_id then 'Frontend resume'
        when java_resume_id then 'Java resume'
        when cyber_resume_id then 'Cybersecurity resume'
      end,
      alt_text = null
  where id in (frontend_resume_id, java_resume_id, cyber_resume_id);

  update public.assets
  set kind = 'image',
      display_name = case id
        when bharatdns_image_id then 'BharatDNS project cover'
        when bharatdns_frontend_image_id then 'BharatDNS frontend project cover'
        when status_agent_image_id then 'Status update AI agent project cover'
        when face_attendance_image_id then 'Face attendance tracking project cover'
      end,
      alt_text = case id
        when bharatdns_image_id then 'Illustration representing the BharatDNS security project'
        when bharatdns_frontend_image_id then 'Illustration representing the BharatDNS monitoring dashboard'
        when status_agent_image_id then 'Illustration representing an AI status update email workflow'
        when face_attendance_image_id then 'Illustration representing privacy-conscious attendance tracking'
      end
  where id in (
    bharatdns_image_id,
    bharatdns_frontend_image_id,
    status_agent_image_id,
    face_attendance_image_id
  );

  insert into public.portfolio_profile (
    id,
    owner_id,
    name,
    tagline,
    contact_email,
    location,
    avatar_asset_id,
    default_resume_asset_id
  ) values (
    1,
    administrator_id,
    'Sarthak Gupta',
    'Frontend Developer | Next.js | TypeScript | Building Scalable AI Systems',
    (select email from private.admin_users where user_id = administrator_id),
    'India',
    avatar_id,
    frontend_resume_id
  )
  on conflict (id) do update set
    owner_id = excluded.owner_id,
    name = excluded.name,
    tagline = excluded.tagline,
    contact_email = excluded.contact_email,
    location = excluded.location,
    avatar_asset_id = excluded.avatar_asset_id,
    default_resume_asset_id = excluded.default_resume_asset_id;

  insert into public.portfolio_domains (
    id,
    owner_id,
    tagline,
    about,
    resume_asset_id,
    display_order,
    visible
  ) values
    (
      'frontend', administrator_id,
      'Crafting Pixel-Perfect Experiences',
      'I craft pixel-perfect, performant web experiences with React, Next.js, and modern CSS. From micro-interactions to full design systems — if it''s on a screen, I make it beautiful.',
      frontend_resume_id, 0, true
    ),
    (
      'java', administrator_id,
      'Architecting Scalable Systems',
      'I architect robust, scalable backend systems using Java and Spring Boot. Clean code, solid design patterns, and enterprise-grade reliability are my hallmarks.',
      java_resume_id, 1, true
    ),
    (
      'cyber', administrator_id,
      'Breaking & Securing Systems',
      'I probe, test, and fortify digital systems. From network security tools to vulnerability assessments — I break things so others can''t.',
      cyber_resume_id, 2, true
    )
  on conflict (id) do update set
    owner_id = excluded.owner_id,
    tagline = excluded.tagline,
    about = excluded.about,
    resume_asset_id = excluded.resume_asset_id,
    display_order = excluded.display_order,
    visible = excluded.visible;

  delete from public.social_links where owner_id = administrator_id;
  insert into public.social_links (
    owner_id, platform, label, url, display_order, visible
  ) values
    (administrator_id, 'github', 'GitHub', 'https://github.com/sarthakg043', 0, true),
    (administrator_id, 'github_org', 'GitHub organization', 'https://github.com/SKD-Innovations', 1, true),
    (administrator_id, 'linkedin', 'LinkedIn', 'https://www.linkedin.com/in/sarthak-gupta-webdev/', 2, true),
    (administrator_id, 'twitter', 'X', 'https://x.com/sarthak_webdev', 3, true);

  delete from public.skills where owner_id = administrator_id;
  insert into public.skills (owner_id, domain, name, display_order, visible)
  select administrator_id, skill.domain, skill.name, skill.display_order, true
  from (values
    ('frontend', 'React', 0),
    ('frontend', 'Next.js', 1),
    ('frontend', 'TypeScript', 2),
    ('frontend', 'JavaScript', 3),
    ('frontend', 'Tailwind CSS', 4),
    ('frontend', 'Framer Motion', 5),
    ('frontend', 'HTML5', 6),
    ('frontend', 'CSS3', 7),
    ('frontend', 'Redux', 8),
    ('frontend', 'Zustand', 9),
    ('frontend', 'Responsive Design', 10),
    ('frontend', 'Figma', 11),
    ('frontend', 'Webpack', 12),
    ('frontend', 'Vite', 13),
    ('java', 'Java', 0),
    ('java', 'Spring Boot', 1),
    ('java', 'Spring MVC', 2),
    ('java', 'Hibernate', 3),
    ('java', 'Maven', 4),
    ('java', 'REST APIs', 5),
    ('java', 'Microservices', 6),
    ('java', 'PostgreSQL', 7),
    ('java', 'MySQL', 8),
    ('java', 'Redis', 9),
    ('java', 'Docker', 10),
    ('java', 'Kafka', 11),
    ('java', 'JUnit', 12),
    ('java', 'Design Patterns', 13),
    ('cyber', 'Network Security', 0),
    ('cyber', 'Penetration Testing', 1),
    ('cyber', 'Linux', 2),
    ('cyber', 'Python', 3),
    ('cyber', 'Wireshark', 4),
    ('cyber', 'Nmap', 5),
    ('cyber', 'Metasploit', 6),
    ('cyber', 'Burp Suite', 7),
    ('cyber', 'OWASP', 8),
    ('cyber', 'DNS Security', 9),
    ('cyber', 'Firewalls', 10),
    ('cyber', 'Cryptography', 11),
    ('cyber', 'CTF', 12),
    ('cyber', 'Bash Scripting', 13),
    ('common', 'Git', 0),
    ('common', 'GitHub', 1),
    ('common', 'VS Code', 2),
    ('common', 'CI/CD', 3),
    ('common', 'Agile', 4),
    ('common', 'Problem Solving', 5)
  ) as skill(domain, name, display_order);

  delete from public.experiences where owner_id = administrator_id;
  insert into public.experiences (
    owner_id, title, organization, location, period_label, description,
    tags, domains, display_order, visible
  ) values
    (
      administrator_id, 'SDE-1', 'Tripfactory', 'Bengaluru, India',
      'Jan 2026 – Present',
      'Building scalable web applications with Next.js and Java. Full-stack feature development and code reviews.',
      array['Next.js', 'Java', 'TypeScript'], array['frontend', 'java'], 0, true
    ),
    (
      administrator_id, 'SDE Intern', 'Tripfactory', 'Bengaluru, India',
      'Oct 2025 – Jan 2026',
      'Developed frontend features, built REST APIs, and contributed to production deployments.',
      array['React', 'Java', 'REST APIs'], array['frontend', 'java'], 1, true
    ),
    (
      administrator_id, 'SIH''23 Finalist', 'Smart India Hackathon', 'India',
      '2023',
      'Reached the national finals of Smart India Hackathon, competing among the top teams across the country.',
      array['Hackathon', 'Innovation', 'Teamwork'], array['frontend', 'java', 'cyber'], 2, true
    ),
    (
      administrator_id, 'B.Tech CSE – Cybersecurity', 'IIIT Kottayam', 'Kerala, India',
      '2022 – 2026',
      'Specialized in Cybersecurity with coursework in network security, cryptography, and ethical hacking.',
      array['Cybersecurity', 'Computer Science'], array['cyber', 'frontend', 'java'], 3, true
    );

  delete from public.projects where owner_id = administrator_id;
  insert into public.projects (
    owner_id, name, repository_owner, description, repository_url, demo_url,
    image_asset_id, domains, featured, display_order, visible
  ) values
    (
      administrator_id, 'bharatdns', 'sarthakg043',
      'A network security DNS tool built with Python for DNS filtering and monitoring.',
      'https://github.com/sarthakg043/bharatdns', null,
      bharatdns_image_id, array['cyber'], false, 0, true
    ),
    (
      administrator_id, 'bharatdns-frontend', 'sarthakg043',
      'Frontend dashboard for BharatDNS — real-time DNS monitoring interface.',
      'https://github.com/sarthakg043/bharatdns-frontend', null,
      bharatdns_frontend_image_id, array['frontend', 'cyber'], false, 1, true
    ),
    (
      administrator_id, 'status-update-mail-ai-agent', 'SKD-Innovations',
      'AI-powered agent for automated status update emails.',
      'https://github.com/SKD-Innovations/status-update-mail-ai-agent', null,
      status_agent_image_id, array['java', 'frontend'], false, 2, true
    ),
    (
      administrator_id, 'face-attendance-tracking', 'sarthakg043',
      'Face recognition based attendance tracking system.',
      'https://github.com/sarthakg043/face-attendance-tracking', null,
      face_attendance_image_id, array['cyber', 'frontend'], false, 3, true
    );

  delete from public.certifications where owner_id = administrator_id;
  insert into public.certifications (
    owner_id, name, issuer, year_label, credential_url, domains,
    display_order, visible
  ) values (
    administrator_id,
    'Add your certification here',
    'Issuer Name',
    '2024',
    'https://example.com',
    array['frontend'],
    0,
    true
  );

  insert into public.site_integrations (
    id,
    owner_id,
    github_username,
    show_github_contributions,
    show_github_languages,
    linkedin_followers_label,
    linkedin_connections_label,
    linkedin_headline,
    linkedin_post_urls
  ) values (
    1,
    administrator_id,
    'sarthakg043',
    true,
    true,
    '500+',
    '500+',
    'SDE-1 @ Tripfactory | IIIT Kottayam | Frontend Developer | React.js',
    array[
      'https://www.linkedin.com/embed/feed/update/urn:li:share:YOUR_POST_ID_1',
      'https://www.linkedin.com/embed/feed/update/urn:li:share:YOUR_POST_ID_2',
      'https://www.linkedin.com/embed/feed/update/urn:li:share:YOUR_POST_ID_3'
    ]
  )
  on conflict (id) do update set
    owner_id = excluded.owner_id,
    github_username = excluded.github_username,
    show_github_contributions = excluded.show_github_contributions,
    show_github_languages = excluded.show_github_languages,
    linkedin_followers_label = excluded.linkedin_followers_label,
    linkedin_connections_label = excluded.linkedin_connections_label,
    linkedin_headline = excluded.linkedin_headline,
    linkedin_post_urls = excluded.linkedin_post_urls;

  insert into public.tags (id, owner_id, name, slug)
  values (
    '10000000-0000-4000-8000-000000000001',
    administrator_id,
    'Java',
    'java'
  )
  on conflict (id) do update set
    owner_id = excluded.owner_id,
    name = excluded.name,
    slug = excluded.slug;

  insert into public.articles (
    id, author_id, title, slug, excerpt, content, content_text, status,
    featured, seo_title, seo_description, canonical_url, external_url,
    reading_time_minutes, published_at
  ) values
    (
      '20000000-0000-4000-8000-000000000001',
      administrator_id,
      'System Prompts and Prompting Types: Mastering AI''s Hidden Playbook',
      'system-prompts-and-prompting-types-mastering-ais-hidden-playbook',
      $excerpt$For months, you've likely been firing off questions to AI like ChatGPT, getting responses that feel almost human. But ever wondered what's pulling the strings? Why does the AI sometimes respond like a wise mentor and other times like a quirky comedian? It's not random — it's...$excerpt$,
      jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(jsonb_build_object(
          'type', 'paragraph',
          'content', jsonb_build_array(jsonb_build_object(
            'type', 'text',
            'text', $content$For months, you've likely been firing off questions to AI like ChatGPT, getting responses that feel almost human. But ever wondered what's pulling the strings? Why does the AI sometimes respond like a wise mentor and other times like a quirky comedian? It's not random — it's...$content$
          ))
        ))
      ),
      $content_text$For months, you've likely been firing off questions to AI like ChatGPT, getting responses that feel almost human. But ever wondered what's pulling the strings? Why does the AI sometimes respond like a wise mentor and other times like a quirky comedian? It's not random — it's...$content_text$,
      'published', false,
      'System Prompts and Prompting Types: Mastering AI''s Hidden Playbook',
      $seo$Learn how system prompts and prompting types shape AI responses.$seo$,
      'https://medium.com/@sarthakg043/system-prompts-and-prompting-types-mastering-ais-hidden-playbook-4a9d312767f0',
      'https://medium.com/@sarthakg043/system-prompts-and-prompting-types-mastering-ais-hidden-playbook-4a9d312767f0',
      1,
      '2025-08-15 12:00:00+00'
    ),
    (
      '20000000-0000-4000-8000-000000000002',
      administrator_id,
      'How does ChatGPT understand Human Language?',
      'how-does-chatgpt-understand-human-language',
      $excerpt$For months, this question had been a curiosity for every developer and student researcher. Why? Are there no resources available? Is it a classified information? No, the resources are available but...$excerpt$,
      jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(jsonb_build_object(
          'type', 'paragraph',
          'content', jsonb_build_array(jsonb_build_object(
            'type', 'text',
            'text', $content$For months, this question had been a curiosity for every developer and student researcher. Why? Are there no resources available? Is it a classified information? No, the resources are available but...$content$
          ))
        ))
      ),
      $content_text$For months, this question had been a curiosity for every developer and student researcher. Why? Are there no resources available? Is it a classified information? No, the resources are available but...$content_text$,
      'published', false,
      'How does ChatGPT understand Human Language?',
      $seo$An approachable introduction to how language models process human language.$seo$,
      'https://medium.com/@sarthakg043/how-does-chatgpt-understand-human-language-a2d0f6821404',
      'https://medium.com/@sarthakg043/how-does-chatgpt-understand-human-language-a2d0f6821404',
      1,
      '2025-08-13 12:00:00+00'
    )
  on conflict (id) do update set
    author_id = excluded.author_id,
    title = excluded.title,
    slug = excluded.slug,
    excerpt = excluded.excerpt,
    content = excluded.content,
    content_text = excluded.content_text,
    status = excluded.status,
    featured = excluded.featured,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    canonical_url = excluded.canonical_url,
    external_url = excluded.external_url,
    reading_time_minutes = excluded.reading_time_minutes,
    published_at = excluded.published_at,
    deleted_at = null;

  insert into public.article_tags (article_id, tag_id) values
    ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001'),
    ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001')
  on conflict (article_id, tag_id) do nothing;
end;
$$;
