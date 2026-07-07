import Note from '../models/Note.js';

export const getNotes = async (req, res) => {
  try {
    const userRole = req.user?.role || 'user';

    let query = {};

    if (userRole === 'admin') {
      query = {};
    } else if (userRole === 'faculty') {
      query = {};
    } else {

      query = {};
    }

    const notes = await Note.find({})
      .sort({ createdAt: -1 })
      .limit(100);

    const adminNotes = notes.filter(note => note.type === 'admin');
    const facultyNotes = notes.filter(note => note.type === 'faculty');

    console.log(`Found ${adminNotes.length} admin notes and ${facultyNotes.length} faculty notes for ${userRole}`);

    res.status(200).json({
      success: true,
      data: {
        adminNotes,
        facultyNotes,
        userRole,
      },
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notes',
      error: error.message,
    });
  }
};

export const addNote = async (req, res) => {
  try {
    const { text, color, type } = req.body;
    const userRole = req.user?.role || 'user';
    const userId = req.user?._id;
    const userName = req.user?.name || 'User';

    console.log(`Adding note: type=${type}, role=${userRole}, user=${userName}`);

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note text is required',
      });
    }

    if (type === 'admin' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can add admin notes',
      });
    }

    if (type === 'faculty' && userRole !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Only faculty can add faculty notes',
      });
    }

    const note = new Note({
      type,
      text: text.trim(),
      color: color || 'blue',
      author: userName,
      authorId: userId,
      authorRole: userRole,
    });

    await note.save();

    console.log(`Note added: ${note._id} - ${note.type} - ${note.author}`);

    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      data: note,
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding note',
      error: error.message,
    });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?._id;

    console.log(`Deleting note: ${id} by ${userRole}`);

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    if (note.authorId.toString() !== userId.toString() && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this note',
      });
    }

    await note.deleteOne();

    console.log(`Note deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting note',
      error: error.message,
    });
  }
};