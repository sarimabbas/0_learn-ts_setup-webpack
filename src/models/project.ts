// make it a class, not an interface, so you can instantiate it
export enum ProjectStatus {
  ACTIVE = "active",
  FINISHED = "finished",
}

export class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}
