alter policy "Public can read published articles"
on public.articles to anon;

alter policy "Public can read public asset metadata"
on public.assets to anon;

alter policy "Public can read tags"
on public.tags to anon;

alter policy "Public can read published article tags"
on public.article_tags to anon;

alter policy "Public can read published article assets"
on public.article_assets to anon;

alter policy "Public can read portfolio profile"
on public.portfolio_profile to anon;

alter policy "Public can read visible portfolio domains"
on public.portfolio_domains to anon;

alter policy "Public can read visible social links"
on public.social_links to anon;

alter policy "Public can read visible skills"
on public.skills to anon;

alter policy "Public can read visible experiences"
on public.experiences to anon;

alter policy "Public can read visible projects"
on public.projects to anon;

alter policy "Public can read visible certifications"
on public.certifications to anon;

alter policy "Public can read site integrations"
on public.site_integrations to anon;
