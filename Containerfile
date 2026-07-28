FROM ruby:3.2-slim

ENV LANG=C.UTF-8 \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_JOBS=4 \
    BUNDLE_RETRY=3 \
    JEKYLL_ENV=development

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    ca-certificates \
    libffi-dev \
    libssl-dev \
    zlib1g-dev \
    pkg-config \
    libxml2-dev \
    libxslt1-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /srv/jekyll

# Copy only dependency manifests so the bundle-install layer stays cached
# across source changes. The site source is mounted at runtime via compose.
COPY Gemfile Gemfile.lock jekyll-theme-console.gemspec ./

RUN bundle install

EXPOSE 4000 35729

CMD ["bash", "-lc", "bundle exec jekyll serve --host 0.0.0.0 --port 4000 --livereload"]
