// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";

struct Memo {
    uint256 id;
    address from;
    uint256 timestamp;
    string name;
    string message;
}

contract Coffee is Ownable{

    Memo[] public Memos;

    uint256 public memoCount;

    constructor() Ownable(msg.sender) {}

    event newMemo (
        uint256 indexed id,
        address from,
        uint256 timestamp,
        string name,
        string message
    );

    function buyCoffee (
        string calldata _name,
        string calldata _message
        ) public payable {

            require(msg.value > 0, "Amount must be greater than 0");

            memoCount ++;
            
            uint newMemoId = memoCount;

            Memos.push(Memo({
                id: newMemoId,
                from: msg.sender,
                timestamp: block.timestamp,
                name: _name,
                message: _message
            }));

            
            emit newMemo (
                newMemoId,
                msg.sender,
                block.timestamp,
                _name,
                _message
            );
    }

    function withdrawTip() public onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Transaction failed!");
    }

    function getMemos() public view returns (Memo[] memory) {
        return Memos;
    }

}