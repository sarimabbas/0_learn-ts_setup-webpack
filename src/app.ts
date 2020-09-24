import { Draggable, DragTarget } from "./models/drag-drop";
import { Project, ProjectStatus } from "./models/project";

abstract class Component<
  elementType extends HTMLElement,
  hostType extends HTMLElement
> {
  templateElement: HTMLTemplateElement;
  hostElement: hostType;
  element: elementType;

  constructor(
    templateElementId: string,
    hostElementId: string,
    insertAtStart: boolean,
    elementId?: string
  ) {
    this.templateElement = document.getElementById(
      templateElementId
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId)! as hostType;

    this.element = document.importNode(this.templateElement, true).content
      .firstElementChild as elementType;

    // add a typeguard for optional parameter
    if (elementId) {
      this.element.id = elementId;
    }

    this.attach(insertAtStart);
  }

  private attach(insertAtStart: boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtStart ? "afterbegin" : "beforeend",
      this.element
    );
  }

  abstract configure(): void;
  abstract renderContent(): void;
}

interface ValidatorConfig {
  value: string | number;
  required?: boolean;
  // for strings
  minLength?: number;
  maxLength?: number;
  // for numbers
  min?: number;
  max?: number;
}

function validate(config: ValidatorConfig): boolean {
  // this is how you can do a series of checks
  let isValid = true;
  if (config.required) {
    isValid = isValid && config.value.toString().trim().length > 0;
  }
  if (config.minLength && typeof config.value === "string") {
    isValid = isValid && config.value.length >= config.minLength;
  }
  if (config.maxLength && typeof config.value === "string") {
    isValid = isValid && config.value.length <= config.maxLength;
  }
  if (config.min && typeof config.value === "number") {
    isValid = isValid && config.value >= config.min;
  }
  if (config.max && typeof config.value === "number") {
    isValid = isValid && config.value <= config.max;
  }
  return isValid;
}

class ProjectItem
  extends Component<HTMLLIElement, HTMLUListElement>
  implements Draggable {
  private project: Project;
  constructor(hostId: string, project: Project) {
    super("single-project", hostId, false, project.id);
    this.project = project;

    this.configure();
    this.renderContent();
  }

  get peopleCount(): string {
    if (this.project.people === 1) {
      return "1 person assigned";
    }
    return `${this.project.people} people assigned`;
  }

  public renderContent() {
    this.element.querySelector("h2")!.textContent = this.project.title;
    this.element.querySelector("h3")!.textContent = this.peopleCount;
    this.element.querySelector("p")!.textContent = this.project.description;
  }

  public configure() {
    this.element.addEventListener(
      "dragstart",
      this.dragStartHandler.bind(this)
    );

    this.element.addEventListener("dragend", this.dragEndHandler.bind(this));
  }

  dragStartHandler(event: DragEvent) {
    // this is the secret sauce
    event.dataTransfer!.setData("text/plain", this.project.id);
    event.dataTransfer!.effectAllowed = "move";
  }

  dragEndHandler() {}
}

// ProjectList Class
class ProjectList
  extends Component<HTMLElement, HTMLDivElement>
  implements DragTarget {
  assignedProjects: Project[] = [];

  constructor(private type: ProjectStatus) {
    super("project-list", "app", false, `${type}-projects`);

    this.configure();
    this.renderContent();
  }

  private renderProjects() {
    const listId = `${this.type}-projects-list`;
    const listEl = document.getElementById(listId)! as HTMLElement;
    listEl.innerHTML = "";
    this.assignedProjects.forEach((p) => {
      new ProjectItem(this.element.querySelector("ul")!.id, p);
    });
  }

  renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector("h2")!.textContent =
      this.type.toUpperCase() + " PROJECTS";
  }

  configure() {
    ProjectState.getInstance().addListener((projects: Project[]) => {
      this.assignedProjects = projects.filter((p) => p.status === this.type);
      this.renderProjects();
    });

    // drag drop handlers

    this.element.addEventListener(
      "dragleave",
      this.dragLeaveHandler.bind(this)
    );

    this.element.addEventListener("dragover", this.dragOverHandler.bind(this));

    this.element.addEventListener("drop", this.dropHandler.bind(this));
  }

  dragLeaveHandler(_: DragEvent) {
    this.element.querySelector("ul")!.classList.remove("droppable");
  }

  // make style changes to show that the list is droppable
  dragOverHandler(event: DragEvent) {
    if (event.dataTransfer?.types?.[0] === "text/plain") {
      event.preventDefault();
      this.element.querySelector("ul")!.classList.add("droppable");
    }
  }

  dropHandler(event: DragEvent) {
    const projectId = event.dataTransfer!.getData("text/plain");
    ProjectState.getInstance().updateProject(projectId, this.type);
  }
}

type Listener<T> = (items: T[]) => void;

class State<T> {
  protected listeners: Listener<T>[] = [];

  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
  }
}

class ProjectState extends State<Project> {
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {
    super();
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }

  addProject(title: string, description: string, numPeople: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      numPeople,
      ProjectStatus.ACTIVE
    );

    this.projects.push(newProject);
    this.listeners.forEach((listener) => listener(this.projects.slice()));
  }

  updateProject(id: string, status: ProjectStatus) {
    const project = this.projects.filter((p) => p.id === id)[0];
    project.status = status;
    this.listeners.forEach((listener) => listener(this.projects.slice()));
  }
}

class ProjectInput extends Component<HTMLFormElement, HTMLDivElement> {
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    super("project-input", "app", true, "user-input");

    this.titleInputElement = this.element.querySelector(
      "#title"
    )! as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector(
      "#description"
    )! as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector(
      "#people"
    )! as HTMLInputElement;

    this.configure();
  }

  private gatherUserInput(): [string, string, number] | void {
    const title = this.titleInputElement.value;
    const description = this.descriptionInputElement.value;
    const people = +this.peopleInputElement.value;

    const titleValidatable: ValidatorConfig = {
      value: title,
      required: true,
    };

    const descriptionValidatable: ValidatorConfig = {
      value: description,
      required: true,
      minLength: 5,
    };

    const peopleValidatable: ValidatorConfig = {
      value: people,
      required: true,
      min: 1,
      max: 5,
    };

    const isValid = [
      titleValidatable,
      descriptionValidatable,
      peopleValidatable,
    ].every((cfg) => validate(cfg));

    if (isValid) {
      return [title, description, people];
    } else {
      console.log("invalid");
      return;
    }
  }

  private clearInputs() {
    this.titleInputElement.value = "";
    this.descriptionInputElement.value = "";
    this.peopleInputElement.value = "";
  }

  private submitHandler(event: Event) {
    event.preventDefault();
    console.log(this.titleInputElement.value);
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      console.log(userInput);
      const [title, desc, people] = userInput;
      ProjectState.getInstance().addProject(title, desc, people);
      this.clearInputs();
    }
  }

  configure() {
    this.element.addEventListener("submit", this.submitHandler.bind(this));
  }

  renderContent() {}
}

// the singleton prevents us from making multiple state instances by accident
// const prjState = ProjectState.getInstance();

new ProjectInput();
new ProjectList(ProjectStatus.ACTIVE);
new ProjectList(ProjectStatus.FINISHED);
