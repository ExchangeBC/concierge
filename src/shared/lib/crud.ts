export interface ReadManyResponse<Item> {
  total: number;
  offset: number;
  count: number;
  items: Item[];
}
