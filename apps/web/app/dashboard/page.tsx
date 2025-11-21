'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProjects, useCreateProject } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Badge } from '../../components/ui/Badge';

export default function DashboardPage() {
  const { data: projects, isLoading, error } = useProjects();
  const createProject = useCreateProject();
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const project = await createProject.mutateAsync({ name: newProjectName });
      setNewProjectName('');
      setIsCreating(false);

      // Navigate to editor
      window.location.href = `/editor/${project.id}`;
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      {/* Header */}
      <header className="border-b border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-fg-light dark:text-fg-dark px-4 py-2 bg-primary-light dark:bg-primary-dark text-white dark:text-black rounded-lg">
                RUSH
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={() => setIsCreating(true)}>
                + New Project
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-6 text-fg-light dark:text-fg-dark">
          Your Projects
        </h1>

        {/* Create Project Modal */}
        <Modal
          isOpen={isCreating}
          onClose={() => {
            setIsCreating(false);
            setNewProjectName('');
          }}
          title="Create New Project"
        >
          <form onSubmit={handleCreateProject} className="space-y-4">
            <Input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsCreating(false);
                  setNewProjectName('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!newProjectName.trim() || createProject.isPending}
              >
                {createProject.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin border-4 border-primary-light dark:border-primary-dark border-t-transparent w-8 h-8 mb-4 rounded-full"></div>
            <p className="text-fg-light dark:text-fg-dark">Loading projects...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-4 border-primary-light dark:border-primary-dark">
            <p className="font-semibold text-primary-light dark:text-primary-dark mb-2">Error loading projects</p>
            <p className="text-sm text-fg-light dark:text-fg-dark">{error.message}</p>
          </Card>
        )}

        {/* Projects Grid */}
        {projects && projects.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/editor/${project.id}`}>
                <Card className="p-6 hover:shadow-md transition-all cursor-pointer">
                  <h3 className="text-lg font-semibold mb-3 text-fg-light dark:text-fg-dark">
                    {project.name}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-light dark:text-muted-dark">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-light dark:text-muted-dark">
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {projects && projects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📁</div>
            <h2 className="text-2xl font-semibold mb-2 text-fg-light dark:text-fg-dark">
              No projects yet
            </h2>
            <p className="text-muted-light dark:text-muted-dark mb-6">
              Create your first project to get started with Rush
            </p>
            <Button onClick={() => setIsCreating(true)} size="lg">
              Create Your First Project
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

