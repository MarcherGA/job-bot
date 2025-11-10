export interface JobProps {
  id: string;
  title: string;
  url: string;
  site: string;
  company?: string;
  text?: string;
  postedAt?: Date;
}

export class Job {
  public readonly id: string;
  public readonly title: string;
  public readonly url: string;
  public readonly site: string;
  public readonly company?: string;
  public readonly text?: string;
  public readonly postedAt?: Date;

  constructor(props: JobProps) {
    this.id = props.id;
    this.title = props.title;
    this.url = props.url;
    this.site = props.site;
    this.company = props.company;
    this.text = props.text;
    this.postedAt = props.postedAt;
  }
}
