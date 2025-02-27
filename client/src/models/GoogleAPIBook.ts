export interface GoogleAPIVolumeInfo {
  infoLink: string;
  title: string;
  authors: string[];
  description: string;
  imageLinks: {
    smallThumbnail: string;
    thumbnail: string;
  };
}

export interface GoogleAPIBook {
    id: string;
    volumeInfo: GoogleAPIVolumeInfo;
}
