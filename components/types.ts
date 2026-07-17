export type RepoSummary = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: string;
  avatar: string;
  branch: string;
  updated_at: string;
  size: number;
  description: string | null;
};

export type Kind =
  | "image"
  | "video"
  | "audio"
  | "doc"
  | "office"
  | "text"
  | "other"
  | "dir";

export type Item = {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir";
  kind: Kind;
  url: string | null;
};

export type Listing = {
  repo: {
    full_name: string;
    private: boolean;
    branch: string;
    default_branch: string;
    size: number;
  };
  path: string;
  items: Item[];
};

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB"];
  let i = -1;
  do {
    n /= 1024;
    i++;
  } while (n >= 1024 && i < units.length - 1);
  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`;
}
