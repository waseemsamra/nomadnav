import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  country?: string;
  price?: number;
  rating?: number;
  summary?: string;
  iata?: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;

    