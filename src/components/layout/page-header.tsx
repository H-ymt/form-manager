interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="">
        <div>
          <h1 className="">{title}</h1>
          {description && <p className="">{description}</p>}
        </div>
        {actions && <div className="">{actions}</div>}
      </div>
    </div>
  );
}
