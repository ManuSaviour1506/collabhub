import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../services/api';

const ProjectBoard = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [newTask, setNewTask] = useState("");
  
  // Columns state
  const [columns, setColumns] = useState({
    todo: { id: 'todo', title: 'To Do', items: [] },
    doing: { id: 'doing', title: 'In Progress', items: [] },
    done: { id: 'done', title: 'Done', items: [] }
  });

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const { data } = await api.get(`/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(data);
      organizeTasks(data.tasks);
    } catch (error) { console.error(error); }
  };

  const organizeTasks = (tasks) => {
    const newCols = {
      todo: { id: 'todo', title: 'To Do', items: [] },
      doing: { id: 'doing', title: 'In Progress', items: [] },
      done: { id: 'done', title: 'Done', items: [] }
    };
    tasks.forEach(t => {
      if(newCols[t.status]) newCols[t.status].items.push(t);
    });
    setColumns(newCols);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if(!newTask) return;
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const { data } = await api.post(`/projects/${id}/tasks`, { title: newTask }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTask("");
      organizeTasks(data.tasks);
    } catch (error) { console.error(error); }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    // Optimistic UI Update (Update local state immediately)
    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const sourceItems = [...sourceCol.items];
    const destItems = [...destCol.items];
    const [removed] = sourceItems.splice(source.index, 1);
    
    if (source.droppableId === destination.droppableId) {
      sourceItems.splice(destination.index, 0, removed);
      setColumns({ ...columns, [source.droppableId]: { ...sourceCol, items: sourceItems } });
    } else {
      destItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceCol, items: sourceItems },
        [destination.droppableId]: { ...destCol, items: destItems }
      });

      // API Call to save change
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        await api.put(`/projects/${id}/tasks/${removed._id}`, { status: destination.droppableId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) { console.error("Failed to update task status"); }
    }
  };

  if (!project) return <div className="p-8">Loading Board...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{project.title}</h1>
          <p className="text-gray-500">Task Board</p>
        </div>
        <form onSubmit={handleAddTask} className="flex gap-2">
          <input 
            type="text" 
            className="p-2 border rounded" 
            placeholder="New Task..." 
            value={newTask} 
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">+ Add</button>
        </form>
      </div>

      <div className="flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full min-w-[800px]">
            {Object.entries(columns).map(([columnId, column]) => (
              <div key={columnId} className="flex-1 bg-gray-200 rounded-lg p-4 flex flex-col min-h-[500px]">
                <h2 className="text-lg font-bold mb-4 text-gray-700 uppercase">{column.title}</h2>
                <Droppable droppableId={columnId}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex-1 flex flex-col gap-3"
                    >
                      {column.items.map((item, index) => (
                        <Draggable key={item._id} draggableId={item._id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-4 rounded shadow-sm border-l-4 border-indigo-500"
                            >
                              <p className="text-gray-800">{item.title}</p>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default ProjectBoard;