export const SPECIES = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'bird', label: 'Bird' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'other', label: 'Other' },
];

export interface LabelOption {
  value: string;
  label: string;
}

const labelOf = (list: LabelOption[], value: string): string =>
  list.find((o) => o.value === value)?.label ?? value;

export const speciesLabel = (v: string): string => labelOf(SPECIES, v);

export const formatAge = (age: number | null | undefined): string | null =>
  age === null || age === undefined ? null : `${age} ${Number(age) === 1 ? 'year' : 'years'}`;