export type TextMessage = {
  id: string;
  kind: "text";
  text: string;
  mine?: boolean;
};

export type PhotoMessage = {
  id: string;
  kind: "photo";
  uri: string;
  mine?: boolean;
};

export type LocationMessage = {
  id: string;
  kind: "location";
  latitude: number;
  longitude: number;
  approximate: boolean;
  mine?: boolean;
};

export type Message = TextMessage | PhotoMessage | LocationMessage;
