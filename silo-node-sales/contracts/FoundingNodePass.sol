// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title TUDAO Founding Node Pass
 * @notice ERC721 NFT for Founding tier node licenses - NON-TRANSFERABLE until unlocked
 * @dev Limited to 300 total supply with transfer restrictions until DAO vote
 */
contract FoundingNodePass is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 public constant MAX_SUPPLY = 300;
    uint256 private _nextTokenId = 1;
    string private _baseTokenURI;
    bool public transfersEnabled = false;
    
    event TransfersEnabled();
    
    constructor(
        address admin,
        string memory baseURI
    ) ERC721("TUDAO Founding Node Pass", "TUDAO-FOUNDER") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _baseTokenURI = baseURI;
    }
    
    /**
     * @notice Mint a new Founding Node Pass NFT
     * @param to Recipient address
     * @return tokenId The ID of the minted token
     */
    function mint(address to) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(_nextTokenId <= MAX_SUPPLY, "Max supply reached");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }
    
    /**
     * @notice Enable transfers via DAO governance vote
     * @dev Can only be called once by admin
     */
    function enableTransfers() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!transfersEnabled, "Transfers already enabled");
        transfersEnabled = true;
        emit TransfersEnabled();
    }
    
    /**
     * @notice Update the base token URI
     * @param baseURI New base URI
     */
    function setBaseURI(string memory baseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @notice Get the base token URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @notice Get total supply
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    /**
     * @notice Get remaining supply
     */
    function remainingSupply() public view returns (uint256) {
        return MAX_SUPPLY - (_nextTokenId - 1);
    }
    
    /**
     * @dev Override to enforce transfer lock until DAO unlocks
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        // Block transfers unless enabled by DAO
        if (from != address(0) && to != address(0)) {
            require(transfersEnabled, "Transfers locked until DAO vote");
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Required override for AccessControl + ERC721
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
