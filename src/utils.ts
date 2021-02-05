const getHeaders = (GITHUB_TOKEN: string) => {
  return GITHUB_TOKEN
    ? {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
    : {};
};
