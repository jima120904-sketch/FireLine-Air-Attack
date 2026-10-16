using System;
using UnityEngine;

namespace FireWing.Data
{
    /// <summary>One aircraft and its parent, branch, and tier in the progression tree.</summary>
    [Serializable]
    public sealed class TechTreeNode
    {
        /// <summary>Aircraft identifier represented by this node.</summary>
        public string aircraftId;

        /// <summary>Aircraft asset referenced by this node.</summary>
        public AircraftData aircraft;

        /// <summary>Parent aircraft identifier, or empty for a starter node.</summary>
        public string parentId;

        /// <summary>Tech-tree branch for this node.</summary>
        public AircraftBranch branch;

        /// <summary>Progression tier for this node.</summary>
        [Range(1, 5)] public int tier = 1;
    }
}