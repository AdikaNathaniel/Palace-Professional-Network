import { useRef, useState } from 'react';
import BiodataForm from './components/BiodataForm';
import Directory, { type DirectoryHandle } from './components/Directory';
import TypewriterHeading from './components/TypewriterHeading';

type Tab = 'form' | 'directory';

export default function App() {
  const [tab, setTab] = useState<Tab>('form');
  const directoryRef = useRef<DirectoryHandle>(null);

  const goToDirectory = () => {
    setTab('directory');
    directoryRef.current?.refresh();
  };

  const selectTab = (next: Tab) => {
    setTab(next);
    if (next === 'directory') directoryRef.current?.refresh();
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <TypewriterHeading text="Palace Professional Network" speedMs={70} startDelayMs={300} />
      </header>

      <nav className="app-tabs">
        <button
          className={`app-tab ${tab === 'form' ? 'active' : ''}`}
          onClick={() => selectTab('form')}
        >
          📝 Biodata Form
        </button>
        <button
          className={`app-tab ${tab === 'directory' ? 'active' : ''}`}
          onClick={() => selectTab('directory')}
        >
          👥 Directory
        </button>
      </nav>

      <main className="app-main">
        {tab === 'form' ? <BiodataForm onSubmitted={goToDirectory} /> : <Directory ref={directoryRef} />}
      </main>
    </div>
  );
}
